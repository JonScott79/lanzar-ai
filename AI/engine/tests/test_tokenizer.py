"""
    test_tokenizer.py

    Unit tests for LANZAR AI Tokenizers.

    Responsibilities:
    - Verify lossless round-trip encoding and decoding
    - Test multilingual handling (Latin, Cyrillic, CJK, Arabic, Accents, Emoji)
    - Validate special tokens and OOV-free guarantee
"""

import unittest
from AI.engine.tokenizer.byte_tokenizer import ByteTokenizer
from AI.engine.tokenizer.char_tokenizer import CharTokenizer


class TestTokenizers(unittest.TestCase):

    def setUp(self):
        self.byte_tok = ByteTokenizer()

    def test_byte_tokenizer_english(self):
        text = "LANZAR AI: Two Minds. One Mission. Penelope and Peter."
        tokens = self.byte_tok.encode(text)
        self.assertIsInstance(tokens, list)
        self.assertTrue(len(tokens) > 0)
        decoded = self.byte_tok.decode(tokens)
        self.assertEqual(decoded, text)

    def test_byte_tokenizer_multilingual(self):
        samples = [
            "Café, résumé, señor, Über",               # Accented Latin
            "Пётр и Пенелопа — ракетные двигатели",      # Cyrillic
            "兰扎尔 AI 宇宙探索とロケット工学",             # CJK (Chinese & Japanese)
            "ذكاء لانزار الاصطناعي - بيني وبيت",         # Arabic
            "लैनज़ार एआई: पेनी और पीट",                 # Devanagari (Hindi)
            "🚀 ⚛️ ✦ Atomic Age Intelligence 1950",    # Emojis and Symbols
        ]

        for s in samples:
            tokens = self.byte_tok.encode(s)
            decoded = self.byte_tok.decode(tokens)
            self.assertEqual(decoded, s, f"Failed roundtrip for: {s}")

    def test_byte_tokenizer_special_tokens(self):
        text = "Rocket Engine"
        tokens = self.byte_tok.encode(text, add_special_tokens=True)
        self.assertEqual(tokens[0], self.byte_tok.bos_id)
        self.assertEqual(tokens[-1], self.byte_tok.eos_id)
        decoded = self.byte_tok.decode(tokens, skip_special_tokens=True)
        self.assertEqual(decoded, text)

    def test_char_tokenizer_custom_corpus(self):
        corpus = "Penny and Pete are building LANZAR AI rockets."
        char_tok = CharTokenizer.from_text(corpus)
        tokens = char_tok.encode("Penny rockets")
        decoded = char_tok.decode(tokens)
        self.assertEqual(decoded, "Penny rockets")


if __name__ == "__main__":
    unittest.main()
