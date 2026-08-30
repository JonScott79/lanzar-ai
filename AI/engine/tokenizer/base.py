"""
    base.py

    Abstract base interface for all LANZAR AI tokenizers.

    Responsibilities:
    - Define common contract for text-to-token encoding and token-to-text decoding
    - Handle special tokens (PAD, BOS, EOS, UNK)
    - Ensure clean decoupling between tokenizer implementations and transformer models
"""

from abc import ABC, abstractmethod
from typing import List, Union


# =====================================
# Base Tokenizer Abstract Class
# =====================================

class BaseTokenizer(ABC):
    """
    Abstract base class for all tokenizers in the LANZAR model ecosystem.
    """

    # Special token constants
    PAD_TOKEN = "<|pad|>"
    BOS_TOKEN = "<|bos|>"
    EOS_TOKEN = "<|eos|>"
    UNK_TOKEN = "<|unk|>"

    def __init__(self):
        pass

    @property
    @abstractmethod
    def vocab_size(self) -> int:
        """Returns total vocabulary size including special tokens."""
        pass

    @property
    @abstractmethod
    def pad_id(self) -> int:
        """Token ID for padding."""
        pass

    @property
    @abstractmethod
    def bos_id(self) -> int:
        """Token ID for beginning of sequence."""
        pass

    @property
    @abstractmethod
    def eos_id(self) -> int:
        """Token ID for end of sequence."""
        pass

    @property
    @abstractmethod
    def unk_id(self) -> int:
        """Token ID for unknown token."""
        pass

    @abstractmethod
    def encode(self, text: str, add_special_tokens: bool = False) -> List[int]:
        """
        Converts text string into a list of integer token IDs.
        """
        pass

    @abstractmethod
    def decode(self, token_ids: List[int], skip_special_tokens: bool = True) -> str:
        """
        Converts a list of integer token IDs back into a text string.
        """
        pass
