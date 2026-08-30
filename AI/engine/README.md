# LANZAR-001 — Model Engine Documentation

## Mission
**LANZAR-001** is the foundational decoder-only GPT-style transformer model engine for the LANZAR AI general-purpose intelligence project.

Built natively in **Python & PyTorch**, it provides the foundational transformer neural architecture, universal UTF-8 byte-level tokenization, sequence chunking dataset pipelines, training loop with AdamW and gradient clipping, atomic checkpointing, and standalone autoregressive text inference with temperature and nucleus (top-p) sampling.

---

## 🏛️ Architecture Overview

```text
Text Prompt / Corpus
         │
         ▼
 ┌─────────────────┐
 │  ByteTokenizer  │  (UTF-8 Byte-level, 256 byte values + 4 special tokens = 260 vocab)
 └────────┬────────┘
          │ (Token IDs)
          ▼
 ┌─────────────────┐
 │ Input Embedding │  Token Embedding (wte) + Positional Embedding (wpe) + Dropout
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │ Transformer     │  x = x + MultiHeadCausalSelfAttention(LayerNorm(x))
 │ Blocks (1..N)   │  x = x + FeedForward_MLP_GELU(LayerNorm(x))
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │ Final LayerNorm │
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │     LM Head     │  Linear projection tied to input embeddings
 └────────┬────────┘
          │
          ▼
  Logits / Next Token
```

### Key Components

1. **`ByteTokenizer`** (`AI/engine/tokenizer/byte_tokenizer.py`):
   - Encodes text directly to UTF-8 byte sequences with zero Out-of-Vocabulary (OOV) errors across all human scripts (Latin, Cyrillic, CJK, Arabic, Devanagari, Greek, Emoji).
2. **`CausalSelfAttention`** (`AI/engine/model/attention.py`):
   - Multi-head scaled dot-product attention with strict lower-triangular causal autoregressive masking.
3. **`MLP`** (`AI/engine/model/mlp.py`):
   - Position-wise feed-forward network with GELU non-linearity.
4. **`LanzarGPT`** (`AI/engine/model/transformer.py`):
   - Pre-LayerNorm decoder-only transformer with weight tying between embedding and output layers.
5. **`LanzarTrainer`** (`AI/engine/training/trainer.py`):
   - Training engine with AdamW optimizer, gradient clipping (`norm <= 1.0`), evaluation loss, and step logging.
6. **`CheckpointManager`** (`AI/engine/training/checkpoint.py`):
   - Atomic saving and loading of model state dict, optimizer state, config, and step telemetry.
7. **`LanzarGenerator`** (`AI/engine/inference/generator.py`):
   - Autoregressive text sampling with temperature, top-k, and top-p (nucleus) filtering, with streaming support.

---

## ⚙️ Hyperparameter Presets

| Parameter | `LanzarModelConfig.tiny()` (Default) | `LanzarModelConfig.small()` |
| :--- | :--- | :--- |
| **Parameters** | ~1.2 Million | ~9.5 Million |
| **Context Length (T)** | 128 tokens | 256 tokens |
| **Embedding Dim ($d_{\text{model}}$)** | 128 | 256 |
| **Transformer Layers ($N$)** | 4 | 6 |
| **Attention Heads ($h$)** | 4 | 8 |
| **Feed-Forward Dim ($d_{\text{ff}}$)** | 512 | 1024 |
| **Vocabulary Size** | 260 | 260 |
| **Dropout** | 0.1 | 0.1 |
| **Target Device** | CPU / CUDA | CPU / CUDA |

---

## 🚀 Running Tests & Sanity Training

### 1. Run Unit Tests
```bash
c:\Projects\lanzar\AI\.venv\Scripts\python.exe -m unittest discover -s c:\Projects\lanzar\AI\engine\tests -p "test_*.py"
```

### 2. Run Sanity Training & Verification
```bash
c:\Projects\lanzar\AI\.venv\Scripts\python.exe c:\Projects\lanzar\AI\engine\run_sanity_train.py
```

---

## 📄 License & Compliance
Built in compliance with `C:\Projects\lanzar\_docs\coding-standards.md`.
&copy; 2026 LANZAR.
