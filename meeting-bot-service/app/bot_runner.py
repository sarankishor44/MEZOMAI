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
    event = patch.pop("event", None)
    if event:
        data.setdefault("events", [])
        data["events"] = [*data["events"], f"{datetime.utcnow().isoformat()}Z {event}"][-30:]
    data.update(patch)
    data["updated_at"] = datetime.utcnow()
    SESSIONS[bot_id] = BotSession(**data)


async def run_bot(bot_id: str, req: JoinBotRequest):
    update_session(bot_id, status="joining", message="Launching browser.", event="Launching browser")
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
        update_session(bot_id, message="Opening meeting link.", event=f"Opening {req.meeting_url}")
        await page.goto(str(req.meeting_url), wait_until="domcontentloaded", timeout=60000)
        update_session(bot_id, last_url=page.url, message="Meeting page loaded.", event="Meeting page loaded")
        await page.wait_for_timeout(2500)
        await dismiss_common_popups(page)
        await set_display_name(page, req.bot_name)

        # JOIN first — in-call mute/camera controls only appear AFTER entering the meeting.
        # Calling disable_camera_and_mic() before join clicks wrong lobby buttons.
        platform = detect_platform(str(req.meeting_url))
        joined = await join_by_platform(page, platform, req.bot_name)

        # Wait for in-call UI to render, THEN mute cam/mic
        await page.wait_for_timeout(2500)
        await disable_camera_and_mic(page)
        screenshot_path = await capture_screenshot(page, bot_id)
        state_message = await meeting_state_message(page, platform)

        if joined:
            update_session(
                bot_id,
                status="joined",
                message=state_message or f"{req.bot_name} attempted to join {platform}. It may be waiting for host approval.",
                screenshot_path=screenshot_path,
                last_url=page.url,
                event="Join action completed",
            )
        else:
            update_session(
                bot_id,
                status="waiting_room",
                message=state_message or "Opened meeting link but could not confirm join. Host approval, sign-in, or captcha may be required.",
                screenshot_path=screenshot_path,
                last_url=page.url,
                event="Waiting room or blocked state detected",
            )

        # Keep the bot present until host ends it or max lifetime expires.
        lifetime = min(req.keep_alive_seconds, int(os.getenv("BOT_MAX_SESSION_SECONDS", "5400")))
        await keep_session_alive(page, bot_id, lifetime)
        update_session(bot_id, status="ended", message="Bot session lifetime ended.", last_url=page.url, event="Session lifetime ended")
    except Exception as exc:
        screenshot_path = await capture_screenshot(page, bot_id)
        update_session(bot_id, status="failed", message=f"{type(exc).__name__}: {exc}", screenshot_path=screenshot_path, event="Bot failed")
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
    # Ordered from most specific to least — avoids filling unrelated inputs
    # (search boxes, chat inputs, etc.) that match generic type="text"
    selectors = [
        'input[aria-label*="name" i][type="text"]',
        'input[placeholder*="name" i][type="text"]',
        'input[name*="name" i][type="text"]',
        '[data-testid*="name" i] input',   # scoped fallback
    ]
    for selector in selectors:
        try:
            input_box = page.locator(selector).first()
            if not await input_box.is_visible(timeout=1500):
                continue
            await input_box.click(timeout=1500)
            await input_box.fill("", timeout=1500)
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
    await click_text_if_visible(page, "Use Companion mode", timeout=1000)
    clicked = await click_text_if_visible(page, "Ask to join", timeout=7000)
    if not clicked:
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


async def meeting_state_message(page: Page, platform: str) -> str | None:
    checks = [
        (["someone will let you in", "ask to join", "waiting", "knock"], "Bot is in the waiting room. The meeting host must admit it."),
        (["captcha", "verify you are human"], "Meeting provider requires a human verification step."),
        (["sign in", "login", "log in"], "Meeting provider is asking the bot to sign in before joining."),
        (["leave call", "leave meeting", "participants", "you joined"], "Bot appears to be inside the meeting."),
        (["meeting has ended", "call ended"], "The meeting appears to have ended."),
    ]
    try:
        content = (await page.content()).lower()
    except Exception:
        return None
    for words, message in checks:
        if any(word in content for word in words):
            return message
    return f"Bot opened {platform}; waiting for provider state to settle."


async def keep_session_alive(page: Page, bot_id: str, lifetime: int):
    deadline = asyncio.get_event_loop().time() + lifetime
    while asyncio.get_event_loop().time() < deadline:
        await page.wait_for_timeout(15000)
        message = await meeting_state_message(page, SESSIONS[bot_id].platform)
        update_session(
            bot_id,
            message=message or SESSIONS[bot_id].message,
            last_url=page.url,
            event="Heartbeat",
        )
        if message and "ended" in message.lower():
            break


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
