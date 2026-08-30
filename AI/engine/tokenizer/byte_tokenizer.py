"""
    byte_tokenizer.py

    UTF-8 Byte-Level Tokenizer for LANZAR AI.

    Responsibilities:
    - Provide universal multilingual tokenization across all Unicode scripts
    - Guarantee 0% Out-of-Vocabulary (OOV) failure rate for any human language
    - Map byte values (0-255) with offset for special control tokens
"""

from typing import List
from .base import BaseTokenizer


# =====================================
# Byte-Level Multilingual Tokenizer
# =====================================

class ByteTokenizer(BaseTokenizer):
    """
    Universal UTF-8 byte-level tokenizer.
    
    Mapping structure:
    0: <|pad|>
    1: <|bos|>
    2: <|eos|>
    3: <|unk|>
    4 .. 259: Raw UTF-8 bytes 0x00 .. 0xFF (byte value + 4)
    
    Total vocab size: 260.
    """

    NUM_SPECIAL_TOKENS = 4
    OFFSET = 4

    def __init__(self):
        super().__init__()
        self._pad_id = 0
        self._bos_id = 1
        self._eos_id = 2
        self._unk_id = 3
        self._vocab_size = 256 + self.NUM_SPECIAL_TOKENS

    @property
    def vocab_size(self) -> int:
        return self._vocab_size

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

    # =====================================
    # Encoding & Decoding
    # =====================================

    def encode(self, text: str, add_special_tokens: bool = False) -> List[int]:
        """
        Encodes UTF-8 string into byte token IDs.
        """
        raw_bytes = text.encode("utf-8", errors="replace")
        tokens = [b + self.OFFSET for b in raw_bytes]

        if add_special_tokens:
            tokens = [self._bos_id] + tokens + [self._eos_id]

        return tokens

    def decode(self, token_ids: List[int], skip_special_tokens: bool = True) -> str:
        """
        Decodes byte token IDs back into UTF-8 string.
        """
        byte_list = []
        for tid in token_ids:
            if tid < self.OFFSET:
                if not skip_special_tokens:
                    if tid == self._pad_id:
                        byte_list.extend(self.PAD_TOKEN.encode("utf-8"))
                    elif tid == self._bos_id:
                        byte_list.extend(self.BOS_TOKEN.encode("utf-8"))
                    elif tid == self._eos_id:
                        byte_list.extend(self.EOS_TOKEN.encode("utf-8"))
                    elif tid == self._unk_id:
                        byte_list.extend(self.UNK_TOKEN.encode("utf-8"))
                continue
            
            # Map back from token ID to byte value (0-255)
            byte_val = tid - self.OFFSET
            if 0 <= byte_val <= 255:
                byte_list.append(byte_val)

        return bytes(byte_list).decode("utf-8", errors="replace")
