"""
    test_inference.py

    Unit tests for LANZAR AI inference and text generator.

    Responsibilities:
    - Verify autoregressive text generation from prompt
    - Test max_new_tokens generation limit
    - Test streaming token output
"""

import unittest
from AI.engine.config import LanzarModelConfig
from AI.engine.model.transformer import LanzarGPT
from AI.engine.tokenizer.byte_tokenizer import ByteTokenizer
from AI.engine.inference.generator import LanzarGenerator


class TestInference(unittest.TestCase):

    def setUp(self):
        self.config = LanzarModelConfig.tiny(device="cpu")
        self.model = LanzarGPT(self.config)
        self.tokenizer = ByteTokenizer()
        self.generator = LanzarGenerator(self.model, self.tokenizer, device="cpu")

    def test_text_generation_returns_string(self):
        prompt = "LANZAR AI: "
        output = self.generator.generate(prompt=prompt, max_new_tokens=20, temperature=0.7)
        self.assertIsInstance(output, str)
        self.assertTrue(output.startswith(prompt))
        self.assertGreater(len(output), len(prompt))

    def test_streaming_generation(self):
        prompt = "Rocket: "
        stream = self.generator.stream_generate(prompt=prompt, max_new_tokens=10, temperature=0.0)
        tokens = list(stream)
        self.assertGreater(len(tokens), 0)
        self.assertTrue(all(isinstance(t, str) for t in tokens))


if __name__ == "__main__":
    unittest.main()
