"""
    char_tokenizer.py

    Character-Level Tokenizer for LANZAR AI.

    Responsibilities:
    - Build customized character vocabulary from specific training corpora
    - Provide intuitive tokenization for small-scale experiments and specialized domain models
"""

from typing import List, Dict, Optional
from .base import BaseTokenizer


# =====================================
# Character Tokenizer Class
# =====================================

class CharTokenizer(BaseTokenizer):
    """
    Character-level tokenizer trained on a specific text corpus.
    """

    def __init__(self, vocab: Optional[List[str]] = None):
        super().__init__()
        self.special_tokens = [self.PAD_TOKEN, self.BOS_TOKEN, self.EOS_TOKEN, self.UNK_TOKEN]
        
        if vocab is not None:
            self._chars = sorted(list(set(vocab) - set(self.special_tokens)))
            self._vocab = self.special_tokens + self._chars
        else:
            self._vocab = list(self.special_tokens)

        self._rebuild_maps()

    def _rebuild_maps(self):
        self._stoi: Dict[str, int] = {ch: i for i, ch in enumerate(self._vocab)}
        self._itos: Dict[int, str] = {i: ch for i, ch in enumerate(self._vocab)}
        self._pad_id = self._stoi[self.PAD_TOKEN]
        self._bos_id = self._stoi[self.BOS_TOKEN]
        self._eos_id = self._stoi[self.EOS_TOKEN]
        self._unk_id = self._stoi[self.UNK_TOKEN]

    @classmethod
    def from_text(cls, text: str) -> "CharTokenizer":
        """Builds a character vocabulary directly from sample text."""
        unique_chars = sorted(list(set(text)))
        return cls(vocab=unique_chars)

    @property
    def vocab_size(self) -> int:
        return len(self._vocab)

    @property
    def pad_id(self) -> int:
        return self._pad_id

    @property
    def bos_id(self) -> int:
        return self._bos_id

    @property
    def eos_id(self) -> int:
        return self._eos_id

    @property
    def unk_id(self) -> int:
        return self._unk_id

    def encode(self, text: str, add_special_tokens: bool = False) -> List[int]:
        tokens = [self._stoi.get(c, self._unk_id) for c in text]
        if add_special_tokens:
            tokens = [self._bos_id] + tokens + [self._eos_id]
        return tokens

    def decode(self, token_ids: List[int], skip_special_tokens: bool = True) -> str:
        chars = []
        for tid in token_ids:
            if skip_special_tokens and tid in [self._pad_id, self._bos_id, self._eos_id, self._unk_id]:
                continue
            chars.append(self._itos.get(tid, self.UNK_TOKEN))
        return "".join(chars)
