"""Original British English tutorial narration, generated locally at build time."""
import json
import os
from pathlib import Path
import re
import sys

workspace = Path(__file__).resolve().parent.parent
runtime_dir = Path(os.environ.get('IELTS_INTRO_DLL_DIR', workspace / 'tmp/kokoro-runtime/vclibs'))
dll_directory = os.add_dll_directory(str(runtime_dir)) if sys.platform == 'win32' and runtime_dir.exists() else None

import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro

model_dir = Path(os.environ.get('IELTS_INTRO_KOKORO_DIR', workspace / 'tmp/kokoro-runtime/model'))
output = Path(sys.argv[1])
output.mkdir(parents=True, exist_ok=True)
options = ort.SessionOptions()
options.intra_op_num_threads = 2
options.inter_op_num_threads = 1
engine = Kokoro.from_session(ort.InferenceSession(str(model_dir / 'kokoro-v1.0.onnx'), options, providers=['CPUExecutionProvider']), str(model_dir / 'voices-v1.0.bin'))
catalog = json.loads((workspace / 'src/data/fullMockIntros.json').read_text(encoding='utf-8'))
for section, intro in catalog.items():
    for index, scene in enumerate(intro['scenes']):
        target = output / f'{section}-{index}.wav'
        if os.environ.get('IELTS_INTRO_VOICE_DIR') and target.exists() and target.stat().st_size > 44:
            continue
        clips = []
        for sentence in re.split(r'(?<=[.!?])\s+', scene['text'].replace('IELTS', 'I E L T S')):
            audio, sample_rate = engine.create(sentence, voice='bf_emma', speed=0.96, lang='en-gb')
            audio = np.asarray(audio, dtype=np.float32)
            fade = min(int(sample_rate * 0.008), len(audio) // 2)
            audio[:fade] *= np.linspace(0, 1, fade)
            audio[-fade:] *= np.linspace(1, 0, fade)
            clips.extend([audio, np.zeros(int(sample_rate * 0.18), dtype=np.float32)])
        samples = np.concatenate(clips)
        peak = max(0.3, float(np.max(np.abs(samples))))
        samples *= min(1.3, 0.9 / peak)
        sf.write(target, samples, sample_rate, subtype='PCM_16')
        print(f'Narrated {section}: {scene["title"]} ({len(samples) / sample_rate:.1f}s)', flush=True)
print('All natural British English narration chapters ready', flush=True)
