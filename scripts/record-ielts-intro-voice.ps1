param([Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
$introCatalog = Get-Content -LiteralPath (Join-Path $PSScriptRoot '../src/data/fullMockIntros.json') -Raw | ConvertFrom-Json
$introVoice = New-Object -ComObject SAPI.SpVoice
$englishVoice = @($introVoice.GetVoices()) | Where-Object { $_.GetDescription() -match 'English' } | Select-Object -First 1
if (-not $englishVoice) { throw 'An installed English SAPI voice is required.' }
$introVoice.Voice = $englishVoice
$introVoice.Rate = 0
foreach ($section in $introCatalog.PSObject.Properties) {
  for ($n = 0; $n -lt 4; $n++) {
    $stream = New-Object -ComObject SAPI.SpFileStream
    try {
      $stream.Open((Join-Path $OutputDirectory ($section.Name + '-' + $n + '.wav')), 3, $false)
      $introVoice.AudioOutputStream = $stream
      [void]$introVoice.Speak($section.Value.scenes[$n].text)
    } finally { $stream.Close() }
  }
}
