@echo off
REM ============================================================
REM  FINAL SPRITE SET  -  v2 (simplified for low-resolution)
REM  Double-click to download into this folder.
REM
REM  The five character/Juno sprites are the SIMPLIFIED versions
REM  built to survive a 48-64 grid. The other six are unchanged
REM  from the set you already mapped.
REM ============================================================
cd /d "%~dp0"

echo Downloading final sprite set...

REM ---- locked references ----
curl.exe -L -o "00-console-locked-reference.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260812_232605_f57cb7be-24cc-430b-bdda-633d37752376.png"
curl.exe -L -o "00-character-locked-reference.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_013504_2436abc6-afe8-48c6-ba67-d8cda8fd7226.png"

REM ---- simplified, low-res ready ----
curl.exe -L -o "01-thesis-moodiyan-ton-agge-SIMPLE.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_051056_17bc18ca-5da8-4d11-85ad-ce19a06035fb.png"
curl.exe -L -o "04-liminal-SIMPLE.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_051056_3ef32780-b8fd-4c5d-9f64-118290fd43c5.png"
curl.exe -L -o "08-character-design-juno-SIMPLE.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_051056_a96c34e7-b771-4dd1-a925-9fc03f1a101f.png"
curl.exe -L -o "10-about-waving-SIMPLE.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_051458_0392d83a-a880-4566-a0bc-474134cd49cd.png"
curl.exe -L -o "11-contact-call-SIMPLE.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_051458_cc3bf735-0637-492b-9531-ef4351579aa4.png"

REM ---- unchanged, already mapped ----
curl.exe -L -o "02-scents-by-amman.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_011040_42edeaa3-39fc-4b08-9365-ae16b718e0b7.png"
curl.exe -L -o "03-posters.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_011040_64a2c6bf-f22b-441c-89bc-a18097cb3ba4.png"
curl.exe -L -o "05-motion-graphics.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_011040_3e82529e-57ae-46fa-aef4-a5e2db4af3e1.png"
curl.exe -L -o "06-magazine-layouts.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_011040_e01ceb73-c21c-4965-9567-99da660fa851.png"
curl.exe -L -o "07-cat-illustrations.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_011040_59567a91-510c-44a5-a3f9-46575827de04.png"
curl.exe -L -o "09-ewallet-app.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_011040_40346bf0-3686-4562-8e0a-a1f9ac9f2058.png"

echo.
echo Done. 13 files in this folder.
echo The five marked SIMPLE replace the earlier detailed versions.
pause
