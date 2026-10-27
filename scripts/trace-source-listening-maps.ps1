# Authoring only: convert the supplied local originals to native SVG paths.
# The website renders the paths without an image request or raster decoder.
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Collections.Generic;
using System.Text;
public static class SourceMapTrace {
  class Rect { public int X, Y, Width, Height = 1, Color; }
  public static string Trace(string filename, int omitTop) {
    using (var bitmap = new Bitmap(filename)) {
      var groups = new SortedDictionary<int, List<Rect>>();
      var previous = new Dictionary<string, Rect>();
      for (int y = omitTop; y < bitmap.Height; y++) {
        var next = new Dictionary<string, Rect>();
        for (int x = 0; x < bitmap.Width;) {
          int color = bitmap.GetPixel(x, y).ToArgb() & 0xffffff;
          int end = x + 1;
          while (end < bitmap.Width && (bitmap.GetPixel(end, y).ToArgb() & 0xffffff) == color) end++;
          if (color != 0xffffff) {
            string key = color + ":" + x + ":" + (end - x);
            Rect rect;
            if (previous.TryGetValue(key, out rect)) rect.Height++;
            else {
              rect = new Rect { X = x, Y = y, Width = end - x, Color = color };
              if (!groups.ContainsKey(color)) groups[color] = new List<Rect>();
              groups[color].Add(rect);
            }
            next[key] = rect;
          }
          x = end;
        }
        previous = next;
      }
      var result = new StringBuilder("{\"width\":" + bitmap.Width + ",\"height\":" + bitmap.Height + ",\"paths\":[");
      bool first = true;
      foreach (var group in groups) {
        if (!first) result.Append(',');
        first = false;
        result.Append("{\"fill\":\"#").Append(group.Key.ToString("x6")).Append("\",\"d\":\"");
        foreach (var rect in group.Value) result.Append('M').Append(rect.X).Append(' ').Append(rect.Y).Append('h').Append(rect.Width).Append('v').Append(rect.Height).Append('h').Append(-rect.Width).Append('z');
        result.Append("\"}");
      }
      return result.Append("]}").ToString();
    }
  }
}
'@
$sourceMapRoot = Split-Path $PSScriptRoot -Parent
$sourceMapPairs = @(
  @('public/images/ielts-telegram-16428-image-1.png', 'src/assets/ielts/british-library-paths.json', 30),
  @('public/images/ielts-telegram-16539-image-1.jpg', 'src/assets/ielts/community-centre-paths.json', 0)
)
foreach ($sourceMapPair in $sourceMapPairs) {
  $sourceMapJson = [SourceMapTrace]::Trace((Join-Path $sourceMapRoot $sourceMapPair[0]), $sourceMapPair[2])
  [System.IO.File]::WriteAllText((Join-Path $sourceMapRoot $sourceMapPair[1]), $sourceMapJson, [System.Text.UTF8Encoding]::new($false))
  Write-Output "$($sourceMapPair[1]): $($sourceMapJson.Length) characters"
}
