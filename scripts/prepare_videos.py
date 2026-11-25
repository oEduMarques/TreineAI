"""Convert the attributed wger demonstrations to web-compatible H.264 MP4."""

from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
from urllib.request import urlopen

import imageio_ffmpeg


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data/exercises.json"
OUTPUT = ROOT / "public/videos"


def prepare(item):
    filename = f"{item['id']}.mp4"
    target = OUTPUT / filename
    if target.is_file() and target.stat().st_size > 0:
        return filename
    original = item["video"]
    if not original.startswith("https://wger.de/media/exercise-video/"):
        raise ValueError("Fonte inesperada para o vídeo.")
    with tempfile.TemporaryDirectory() as temp:
        source = Path(temp) / "source"
        encoded = Path(temp) / filename
        with urlopen(original, timeout=75) as response, source.open("wb") as handle:
            shutil.copyfileobj(response, handle)
        subprocess.run(
            [imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-loglevel", "error", "-i", str(source),
             "-map", "0:v:0", "-vf", "scale=-2:480,setsar=1", "-c:v", "libx264",
             "-threads", "2", "-preset", "fast", "-crf", "25", "-pix_fmt", "yuv420p",
             "-an", "-movflags", "+faststart", str(encoded)],
            check=True, timeout=120,
        )
        shutil.copyfile(encoded, target)
    return filename


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    items = json.loads(CATALOG.read_text(encoding="utf-8"))
    hosted = [item for item in items if not item.get("youtubeId")]
    with ThreadPoolExecutor(max_workers=4) as pool:
        jobs = [pool.submit(prepare, item) for item in hosted]
        for item, job in zip(hosted, jobs):
            try:
                item["playback"] = "/videos/" + job.result()
                print(item["name"], item["playback"], flush=True)
            except (OSError, ValueError, subprocess.SubprocessError) as error:
                print(item["name"], type(error).__name__, str(error), flush=True)
    CATALOG.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
