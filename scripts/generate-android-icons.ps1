Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $root 'admin\public\brand\icon-512.png'
$res = Join-Path $root 'android\app\src\main\res'
$brand = [System.Drawing.Color]::FromArgb(255, 15, 76, 92)

function Load-TransparentMark([string]$path) {
  $src = [System.Drawing.Bitmap]::FromFile($path)
  $mark = New-Object System.Drawing.Bitmap $src.Width, $src.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt $src.Height; $y++) {
    for ($x = 0; $x -lt $src.Width; $x++) {
      $p = $src.GetPixel($x, $y)
      if ($p.R -gt 248 -and $p.G -gt 248 -and $p.B -gt 248) {
        $mark.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $p.R, $p.G, $p.B))
      } else {
        $mark.SetPixel($x, $y, $p)
      }
    }
  }
  $src.Dispose()
  return $mark
}

function New-Graphics([System.Drawing.Bitmap]$bitmap) {
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  return $g
}

function Save-Png([System.Drawing.Bitmap]$bitmap, [string]$path) {
  $dir = Split-Path -Parent $path
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir | Out-Null
  }
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Draw-Mark([System.Drawing.Graphics]$g, [System.Drawing.Bitmap]$mark, [int]$size, [double]$scale) {
  $inner = [int][Math]::Round($size * $scale)
  $x = [int][Math]::Round(($size - $inner) / 2)
  $y = [int][Math]::Round(($size - $inner) / 2)
  $g.DrawImage($mark, $x, $y, $inner, $inner)
}

function New-SquareIcon([System.Drawing.Bitmap]$mark, [int]$size, [double]$scale) {
  $bitmap = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = New-Graphics $bitmap
  $g.Clear($brand)
  Draw-Mark $g $mark $size $scale
  $g.Dispose()
  return $bitmap
}

function New-RoundIcon([System.Drawing.Bitmap]$mark, [int]$size, [double]$scale) {
  $bitmap = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = New-Graphics $bitmap
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse(0, 0, $size - 1, $size - 1)
  $g.SetClip($path)
  $g.Clear($brand)
  Draw-Mark $g $mark $size $scale
  $g.Dispose()
  $path.Dispose()
  return $bitmap
}

function New-Foreground([System.Drawing.Bitmap]$mark, [int]$size) {
  $bitmap = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = New-Graphics $bitmap
  $g.Clear([System.Drawing.Color]::Transparent)
  Draw-Mark $g $mark $size 0.58
  $g.Dispose()
  return $bitmap
}

$mark = Load-TransparentMark $sourcePath
$sizes = @{
  'mipmap-mdpi'    = @{ icon = 48;  fg = 108 }
  'mipmap-hdpi'    = @{ icon = 72;  fg = 162 }
  'mipmap-xhdpi'   = @{ icon = 96;  fg = 216 }
  'mipmap-xxhdpi'  = @{ icon = 144; fg = 324 }
  'mipmap-xxxhdpi' = @{ icon = 192; fg = 432 }
}

foreach ($folder in $sizes.Keys) {
  $iconSize = $sizes[$folder].icon
  $fgSize = $sizes[$folder].fg
  $square = New-SquareIcon $mark $iconSize 0.72
  $round = New-RoundIcon $mark $iconSize 0.72
  $fg = New-Foreground $mark $fgSize
  Save-Png $square (Join-Path $res "$folder\ic_launcher.png")
  Save-Png $round (Join-Path $res "$folder\ic_launcher_round.png")
  Save-Png $fg (Join-Path $res "$folder\ic_launcher_foreground.png")
  $square.Dispose()
  $round.Dispose()
  $fg.Dispose()
}

$mark.Dispose()
Write-Host 'Android launcher icons written from the GPS mark.'
