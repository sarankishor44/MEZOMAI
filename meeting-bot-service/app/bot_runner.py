import asyncio
import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict

from playwright.async_api import Browser, Page, TimeoutError as PlaywrightTimeoutError, async_playwright

from .models import BotSession, JoinBotRequest

SESSIONS: Dict[str, BotSession] = {}
_PLAYWRIGHT = None
_BROWSER: Browser | None = None


def detect_platform(url: str) -> str:
    text = url.lower()
    if "meet.google.com" in text:
        return "google_meet"
    if "zoom.us" in text:
        return "zoom"
    if "teams.microsoft" in text:
        return "teams"
    if "meet.jit.si" in text:
        return "jitsi"
    if "whereby.com" in text:
        return "whereby"
    return "generic"


async def start_browser() -> Browser:
    global _PLAYWRIGHT, _BROWSER
    if _BROWSER and _BROWSER.is_connected():
        return _BROWSER

    _PLAYWRIGHT = await async_playwright().start()
    _BROWSER = await _PLAYWRIGHT.chromium.launch(
        headless=os.getenv("BOT_HEADLESS", "true").lower() != "false",
        args=[
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--use-fake-ui-for-media-stream",
            "--use-fake-device-for-media-stream",
            "--autoplay-policy=no-user-gesture-required",
            "--disable-blink-features=AutomationControlled",
            "--window-size=1280,800",
        ],
    )
    return _BROWSER


async def stop_browser():
    global _PLAYWRIGHT, _BROWSER
    if _BROWSER:
        await _BROWSER.close()
        _BROWSER = None
    if _PLAYWRIGHT:
        await _PLAYWRIGHT.stop()
        _PLAYWRIGHT = None


def create_session(req: JoinBotRequest) -> BotSession:
    now = datetime.utcnow()
    bot_id = f"mezobot_{uuid.uuid4().hex[:12]}"
    session = BotSession(
        bot_id=bot_id,
        meeting_url=str(req.meeting_url),
        platform=detect_platform(str(req.meeting_url)),
        bot_name=req.bot_name,
        status="queued",
        message="Bot queued for browser join.",
        created_at=now,
        updated_at=now,
    )
    SESSIONS[bot_id] = session
    return session


def update_session(bot_id: str, **patch):
    session = SESSIONS[bot_id]
    data = session.model_dump()
    data.update(patch)
    data["updated_at"] = datetime.utcnow()
    SESSIONS[bot_id] = BotSession(**data)


async def run_bot(bot_id: str, req: JoinBotRequest):
    update_session(bot_id, status="joining", message="Launching browser.")
    browser = await start_browser()
    context = await browser.new_context(
        viewport={"width": 1280, "height": 800},
        permissions=["camera", "microphone"],
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ),
    )
    page = await context.new_page()

    try:
        await page.goto(str(req.meeting_url), wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(2500)
        await dismiss_common_popups(page)
        await set_display_name(page, req.bot_name)
        await disable_camera_and_mic(page)

        platform = detect_platform(str(req.meeting_url))
        joined = await join_by_platform(page, platform, req.bot_name)
        screenshot_path = await capture_screenshot(page, bot_id)

        if joined:
            update_session(
                bot_id,
                status="joined",
                message=f"{req.bot_name} attempted to join {platform}. It may be waiting for host approval.",
                screenshot_path=screenshot_path,
            )
        else:
            update_session(
                bot_id,
                status="waiting_room",
                message="Opened meeting link but could not confirm join. Host approval or manual captcha may be required.",
                screenshot_path=screenshot_path,
            )

        # Keep the bot present until host ends it or max lifetime expires.
        lifetime = int(os.getenv("BOT_MAX_SESSION_SECONDS", "5400"))
        await page.wait_for_timeout(lifetime * 1000)
        update_session(bot_id, status="ended", message="Bot session lifetime ended.")
    except Exception as exc:
        screenshot_path = await capture_screenshot(page, bot_id)
        update_session(bot_id, status="failed", message=str(exc), screenshot_path=screenshot_path)
    finally:
        await context.close()


async def dismiss_common_popups(page: Page):
    patterns = [
        "Got it",
        "Accept all",
        "Accept",
        "I agree",
        "Continue",
        "Dismiss",
        "Not now",
        "Use without an account",
        "Join from browser",
        "Launch Meeting",
        "Cancel",
    ]
    for text in patterns:
        await click_text_if_visible(page, text, timeout=1200)


async def set_display_name(page: Page, bot_name: str):
    selectors = [
        'input[aria-label*="name" i]',
        'input[placeholder*="name" i]',
        'input[name*="name" i]',
        'input[type="text"]',
    ]
    for selector in selectors:
        try:
            input_box = page.locator(selector).first
            await input_box.fill(bot_name, timeout=1500)
            return
        except Exception:
            continue


async def disable_camera_and_mic(page: Page):
    labels = [
        "Turn off microphone",
        "Mute microphone",
        "Mute",
        "Turn off camera",
        "Stop video",
        "Camera",
    ]
    for label in labels:
        await click_text_if_visible(page, label, timeout=900)


async def join_by_platform(page: Page, platform: str, bot_name: str) -> bool:
    if platform == "google_meet":
        return await join_google_meet(page)
    if platform == "zoom":
        return await join_zoom(page, bot_name)
    if platform == "teams":
        return await join_teams(page, bot_name)
    if platform == "jitsi":
        return await join_jitsi(page, bot_name)
    if platform == "whereby":
        return await join_whereby(page, bot_name)
    return await join_generic(page)


async def join_google_meet(page: Page) -> bool:
    await click_text_if_visible(page, "Ask to join", timeout=7000)
    clicked = await click_text_if_visible(page, "Join now", timeout=3000)
    return clicked or await page_contains(page, ["You're in", "Ask to join", "joined"])


async def join_zoom(page: Page, bot_name: str) -> bool:
    await click_text_if_visible(page, "Join from your browser", timeout=6000)
    await set_display_name(page, bot_name)
    clicked = await click_text_if_visible(page, "Join", timeout=5000)
    await click_text_if_visible(page, "Join Audio by Computer", timeout=4000)
    return clicked or await page_contains(page, ["waiting", "joined", "Leave"])


async def join_teams(page: Page, bot_name: str) -> bool:
    await click_text_if_visible(page, "Continue on this browser", timeout=8000)
    await set_display_name(page, bot_name)
    clicked = await click_text_if_visible(page, "Join now", timeout=6000)
    return clicked or await page_contains(page, ["Someone will let you in", "You're in the meeting", "Leave"])


async def join_jitsi(page: Page, bot_name: str) -> bool:
    await set_display_name(page, bot_name)
    clicked = await click_text_if_visible(page, "Join meeting", timeout=6000)
    if not clicked:
        clicked = await click_text_if_visible(page, "Join", timeout=4000)
    return clicked or await page_contains(page, ["Leave", "Participants"])


async def join_whereby(page: Page, bot_name: str) -> bool:
    await set_display_name(page, bot_name)
    clicked = await click_text_if_visible(page, "Knock", timeout=6000)
    if not clicked:
        clicked = await click_text_if_visible(page, "Join meeting", timeout=4000)
    return clicked or await page_contains(page, ["waiting", "Leave"])


async def join_generic(page: Page) -> bool:
    for label in ["Join", "Join now", "Ask to join", "Enter", "Continue", "Knock"]:
        if await click_text_if_visible(page, label, timeout=1800):
            return True
    return False


async def click_text_if_visible(page: Page, text: str, timeout: int = 1500) -> bool:
    candidates = [
        page.get_by_role("button", name=re.compile(re.escape(text), re.I)),
        page.get_by_text(re.compile(re.escape(text), re.I)),
    ]
    for locator in candidates:
        try:
            await locator.first.click(timeout=timeout)
            await page.wait_for_timeout(600)
            return True
        except Exception:
            continue
    return False


async def page_contains(page: Page, words: list[str]) -> bool:
    try:
        content = (await page.content()).lower()
    except Exception:
        return False
    return any(word.lower() in content for word in words)


async def capture_screenshot(page: Page, bot_id: str) -> str | None:
    try:
        out_dir = Path(os.getenv("BOT_ARTIFACT_DIR", "/tmp/mezomai-bots"))
        out_dir.mkdir(parents=True, exist_ok=True)
        path = out_dir / f"{bot_id}.png"
        await page.screenshot(path=str(path), full_page=False)
        return str(path)
    except Exception:
        return None
