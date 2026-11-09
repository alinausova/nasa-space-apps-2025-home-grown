"""Languages the AI text (summary, tips) can be written in. Codes match the front end's locales."""

LANGUAGES = {"en": "English", "de": "German", "es": "Spanish", "fr": "French", "tr": "Turkish", "ru": "Russian"}
LANG_PATTERN = "^(" + "|".join(LANGUAGES) + ")$"

# Other languages need more tokens for the same sentences (Cyrillic and Turkish most of all).
TOKEN_FACTOR = {"en": 1.0, "de": 1.4, "es": 1.3, "fr": 1.4, "tr": 1.8, "ru": 2.0}


def language_rule(lang: str) -> str:
    """Line appended to a system prompt so the model answers in the user's language."""
    if lang == "en":
        return ""
    return f"\n\nWrite your answer in {LANGUAGES[lang]}. Use the crop names and month names of that language."


def max_tokens(base: int, lang: str) -> int:
    return round(base * TOKEN_FACTOR.get(lang, 1.0))
