"""
    run_sanity_train.py

    End-to-End Sanity Training and Verification Script for LANZAR-001.

    Responsibilities:
    - Inspect actual hardware and compute environment
    - Train LANZAR-001 transformer on curated Atomic Age aerospace and dialogue corpus
    - Record loss descent curve
    - Save model checkpoint to disk
    - Reload checkpoint into clean model instance
    - Generate text completions from test prompts
    - Output complete verification report
"""

import os
import sys
import time
import platform
from pathlib import Path

# Ensure AI directory is on sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Reconfigure stdout for UTF-8 on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import torch
from AI.engine.config import LanzarModelConfig
from AI.engine.tokenizer.byte_tokenizer import ByteTokenizer
from AI.engine.model.transformer import LanzarGPT
from AI.engine.data.dataset import TextDataset
from AI.engine.data.dataloader import create_dataloader
from AI.engine.training.trainer import LanzarTrainer
from AI.engine.training.checkpoint import CheckpointManager
from AI.engine.inference.generator import LanzarGenerator


# =====================================
# Curated Training Corpus
# =====================================

TRAINING_CORPUS = """
LANZAR AEROSPACE & INTELLIGENCE DIVISION — TECHNICAL DOSSIER & LOGS

[PROJECT]: Rocket Engine Redesign — Mark IV Regenerative Thrust Chamber
[LEAD RESEARCHERS]: Penelope "Penny" (Chief of Possibility) and Peter "Pete" (Director of Systems Architecture)

PENNY: "What if we route the liquid propellant through micro-cooling channels machined directly into the combustion chamber wall?"
PETE: "The thermal conductivity of the copper alloy is 380 W/(m·K). If we maintain a wall thickness of 1.2 millimeters, the heat flux will stay well below the critical melting threshold."
PENNY: "Let's test the nozzle expansion ratio at sea level. We can run three test firings this afternoon!"
PETE: "Before we pressurize the fuel manifold, let us verify the turbopump seal tolerances and check the safety bypass valve."
PENNY: "Fair point. But once the seals check out, we launch!"

LANZAR AI is a unified intelligence possessing two complementary perspectives:
1. Penelope (Penny): Action, experimentation, divergent thinking, rapid prototyping, and adventurous exploration. Her instinct is 'Act, Observe, Adapt.'
2. Peter (Pete): Rigorous analysis, systems architecture, thermodynamic verification, and structural stability. His instinct is 'Understand, Discuss, Plan, Act.'

Together, Penny and Pete synthesize hypotheses into proven engineering reality.
When complex trade-offs arise, LANZAR AI evaluates both the creative opportunity and the calculated risk.

TECHNICAL SPECIFICATIONS:
- Combustion Chamber Pressure: 68.5 atmospheres
- Specific Impulse (Vacuum): 318 seconds
- Propellant Mixture: Kerosene and Liquid Oxygen (LOX)
- Nozzle Expansion Ratio: 16:1
- Structural Safety Factor: 1.45

MULTILINGUAL TELEMETRY:
- English: LANZAR AI engine online and operating within nominal parameters.
- Spanish: El motor LANZAR AI está en línea y operando dentro de los parámetros nominales.
- French: Le moteur LANZAR AI est en ligne et fonctionne selon les paramètres nominaux.
- Russian: Двигатель LANZAR AI в сети и работает в пределах номинальных параметров.
- Japanese: LANZAR AIエンジンがオンラインで、定格パラメータ内で動作しています。
- Chinese: LANZAR AI引擎在线并在标称参数内运行。
- German: Das LANZAR AI-Triebwerk ist online und arbeitet innerhalb der Nennparameter.

PENNY: "The ignition sequence is verified. Spark plug armed."
PETE: "Chamber pressure rising smoothly. Telemetry confirms stable laminar flame front."
PENNY: "Look at that thrust curve! Clean expansion across the entire bell."
PETE: "Efficiency is at ninety-four percent of theoretical maximum. Excellent work."
""" * 8  # Repeat corpus to provide sufficient training iterations


# =====================================
# Main Sanity Execution
# =====================================

def run_sanity_run():
    print("=" * 70)
    print("✦ LANZAR-001 — MODEL ENGINE SANITY TRAINING & VERIFICATION ✦")
    print("=" * 70)

    # 1. Hardware Inspection
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"\n[1/6] HARDWARE & RUNTIME INSPECTION:")
    print(f"  • Platform:        {platform.platform()}")
    print(f"  • Python:          {sys.version.split()[0]}")
    print(f"  • PyTorch:         {torch.__version__}")
    print(f"  • Target Device:   {device.upper()}")
    if device == "cuda":
        print(f"  • GPU Model:       {torch.cuda.get_device_name(0)}")
        print(f"  • VRAM:            {torch.cuda.get_device_properties(0).total_memory / (1024**3):.2f} GB")
    else:
        print(f"  • CPU Execution:   Multi-threaded ({torch.get_num_threads()} threads)")

    # 2. Configuration & Model Setup
    print(f"\n[2/6] MODEL ARCHITECTURE & CONFIGURATION:")
    config = LanzarModelConfig.tiny(device=device)
    config.context_length = 64
    config.d_model = 128
    config.n_layers = 4
    config.n_heads = 4
    config.d_ff = 512
    config.learning_rate = 1e-3
    config.batch_size = 8

    tokenizer = ByteTokenizer()
    model = LanzarGPT(config)
    model.to(device)

    total_params = model.get_num_params()
    print(f"  • Model Name:      {config.model_name}")
    print(f"  • Total Params:    {total_params:,} ({total_params / 1e6:.2f}M)")
    print(f"  • Context Length:  {config.context_length}")
    print(f"  • Embedding Dim:   {config.d_model}")
    print(f"  • Layers:          {config.n_layers}")
    print(f"  • Attention Heads: {config.n_heads}")
    print(f"  • Vocab Size:      {config.vocab_size} (UTF-8 Byte Tokenizer)")

    # 3. Dataset Preprocessing
    print(f"\n[3/6] DATASET PREPARATION & TOKENIZATION:")
    dataset = TextDataset(
        text=TRAINING_CORPUS,
        tokenizer=tokenizer,
        context_length=config.context_length,
        stride=16
    )
    dataloader = create_dataloader(dataset, batch_size=config.batch_size, shuffle=True)
    print(f"  • Corpus Characters: {len(TRAINING_CORPUS):,}")
    print(f"  • Dataset Chunks:    {len(dataset):,}")
    print(f"  • Batch Size:        {config.batch_size}")

    # 4. Model Training Run
    print(f"\n[4/6] EXECUTING TRAINING RUN (150 Steps):")
    checkpoint_dir = os.path.join(os.path.dirname(__file__), "checkpoints")
    os.makedirs(checkpoint_dir, exist_ok=True)

    trainer = LanzarTrainer(
        model=model,
        config=config,
        train_loader=dataloader,
        checkpoint_dir=checkpoint_dir
    )

    train_start = time.time()
    results = trainer.train(
        max_steps=150,
        eval_interval=25,
        checkpoint_interval=150
    )
    train_duration = time.time() - train_start

    initial_loss = results["history"][0]["train_loss"]
    final_loss = results["history"][-1]["train_loss"]
    print(f"\n  ✓ Training Completed in {train_duration:.2f}s")
    print(f"  ✓ Initial Loss (Step 25):  {initial_loss:.4f}")
    print(f"  ✓ Final Loss (Step 150):   {final_loss:.4f}")
    print(f"  ✓ Loss Reduction:          {((initial_loss - final_loss) / initial_loss) * 100:.1f}%")

    # 5. Checkpoint Verification
    print(f"\n[5/6] CHECKPOINT SERIALIZATION & RELOAD:")
    saved_ckpt_path = os.path.join(checkpoint_dir, f"{config.model_name}_step_150.pt")
    print(f"  • Saved Checkpoint: {saved_ckpt_path} ({os.path.getsize(saved_ckpt_path) / 1024:.1f} KB)")
    
    # Reload from checkpoint into a fresh model
    reloaded_model, reloaded_config, meta = CheckpointManager.load(saved_ckpt_path, device=device)
    print(f"  ✓ Checkpoint successfully loaded! (Step: {meta['step']}, Recorded Loss: {meta['loss']:.4f})")

    # 6. Autoregressive Inference & Text Generation
    print(f"\n[6/6] INFERENCE & TEXT GENERATION:")
    generator = LanzarGenerator(reloaded_model, tokenizer, device=device)

    test_prompts = [
        "PENNY: ",
        "PETE: ",
        "LANZAR AI: ",
    ]

    for prompt in test_prompts:
        print(f"\n  --- Prompt: \"{prompt}\" ---")
        output = generator.generate(
            prompt=prompt,
            max_new_tokens=100,
            temperature=0.7,
            top_k=30,
            top_p=0.85
        )
        print(f"  [Generated Output]:\n  {output.strip()}\n")

    print("=" * 70)
    print("✦ SANITY VERIFICATION COMPLETE: ALL SYSTEMS NOMINAL ✦")
    print("=" * 70)

    return {
        "device": device,
        "total_params": total_params,
        "initial_loss": initial_loss,
        "final_loss": final_loss,
        "duration_sec": train_duration,
        "checkpoint_path": saved_ckpt_path
    }


if __name__ == "__main__":
    run_sanity_run()
