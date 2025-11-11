#!/usr/bin/env python3
"""
Simple Telegram Bot (python-telegram-bot v20+)

Features:
- /start : welcome message
- /help  : list commands
- /about : short about
- Echo: replies with the same text you send
- /ping  : replies with pong + latency
- simple inline keyboard example
"""

import os
import time
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
)

# Enable logging (console)
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# Get bot token from environment variable BOT_TOKEN or paste directly (not recommended)
BOT_TOKEN = os.getenv("BOT_TOKEN") or "8579631695:AAHRTxhqPf_Skj8x3cPXGuXPY9qYPXJlhAw"

# --- Command handlers ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    text = (
        f"Hi {user.first_name or 'there'}! 👋\n\n"
        "I'm a simple demo bot.\n"
        "Send me any message and I'll echo it back.\n\n"
        "Commands:\n"
        "/help - show help\n"
        "/about - about this bot\n"
        "/ping - check latency\n"
        "/menu - show demo buttons"
    )
    await update.message.reply_text(text)


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Help:\n"
        "/start - Welcome message\n"
        "/help - This message\n"
        "/about - About the bot\n"
        "/ping - Pong + latency\n"
        "Send any text and I'll echo it."
    )


async def about(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Simple Demo Bot\nBuilt with python-telegram-bot.\nMade for demo / hosting tests."
    )


async def ping(update: Update, context: ContextTypes.DEFAULT_TYPE):
    t0 = time.time()
    msg = await update.message.reply_text("Pinging...")
    t1 = time.time()
    latency_ms = int((t1 - t0) * 1000)
    await msg.edit_text(f"Pong! 🏓 {latency_ms} ms")


# Inline keyboard demo
async def menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("Say Hello", callback_data="say_hello")],
        [InlineKeyboardButton("Get ID", callback_data="get_id")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("Choose an option:", reply_markup=reply_markup)


async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data

    if data == "say_hello":
        await query.edit_message_text("Hello! 👋")
    elif data == "get_id":
        user = query.from_user
        await query.edit_message_text(f"Your Telegram ID: {user.id}")


# Echo handler (text messages)
async def echo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    # Simple safety: ignore commands starting with /
    if text.startswith("/"):
        return
    await update.message.reply_text(f"Echo: {text}")


async def unknown(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # For unknown commands
    await update.message.reply_text("Sorry, I didn't understand that command.")


# Error handler
async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    logger.error(msg="Exception while handling an update:", exc_info=context.error)


# --- Main ---
def main():
    if BOT_TOKEN == "" or BOT_TOKEN == "PASTE_YOUR_BOT_TOKEN_HERE":
        logger.error("No BOT_TOKEN found. Set BOT_TOKEN environment variable or paste token in the file.")
        return

    app = ApplicationBuilder().token(BOT_TOKEN).build()

    # Register handlers
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CommandHandler("about", about))
    app.add_handler(CommandHandler("ping", ping))
    app.add_handler(CommandHandler("menu", menu))
    app.add_handler(CallbackQueryHandler(button_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, echo))

    # Fallback for unknown commands
    app.add_handler(MessageHandler(filters.COMMAND, unknown))

    # Error handler
    app.add_error_handler(error_handler)

    logger.info("Bot is starting...")
    app.run_polling(stop_signals=None)  # run until stopped


if __name__ == "__main__":
    main()
