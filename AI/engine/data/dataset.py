"""
    dataset.py

    Dataset abstractions and sequence preprocessing for LANZAR AI.

    Responsibilities:
    - Ingest raw multilingual text corpus
    - Tokenize text using any BaseTokenizer
    - Generate (input, target) sequence pairs for autoregressive next-token prediction
"""

import torch
from torch.utils.data import Dataset
from typing import List, Union
from ..tokenizer.base import BaseTokenizer


# =====================================
# Text Dataset Class
# =====================================

class TextDataset(Dataset):
    """
    Preprocessed autoregressive training dataset.
    Extracts fixed-length chunks (x, y) where y is x shifted by one token.
    """

    def __init__(
        self,
        text: str,
        tokenizer: BaseTokenizer,
        context_length: int,
        stride: int = None
    ):
        self.tokenizer = tokenizer
        self.context_length = context_length
        self.stride = stride if stride is not None else context_length // 2

        # 1. Encode text to tokens
        tokens = tokenizer.encode(text, add_special_tokens=True)
        self.tokens = torch.tensor(tokens, dtype=torch.long)

        # 2. Compute number of valid chunks
        if len(self.tokens) <= self.context_length:
            # Pad if shorter than context length
            padding = torch.full(
                (self.context_length + 1 - len(self.tokens),),
                tokenizer.pad_id,
                dtype=torch.long
            )
            self.tokens = torch.cat([self.tokens, padding])

        self.num_chunks = max(1, (len(self.tokens) - self.context_length) // self.stride)

    def __len__(self) -> int:
        return self.num_chunks

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor]:
        start = idx * self.stride
        end = start + self.context_length

        # Ensure we do not overflow the token buffer
        if end >= len(self.tokens):
            start = len(self.tokens) - self.context_length - 1
            end = start + self.context_length

        x = self.tokens[start:end]
        y = self.tokens[start + 1:end + 1]

        return x, y
