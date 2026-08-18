@echo off
REM ============================================================
REM  Downloads the finalised sprite set into this folder.
REM  Just double-click this file. Windows 10+ has curl built in.
REM ============================================================
cd /d "%~dp0"

echo Downloading sprites...

curl.exe -L -o "00-console-locked-reference.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260812_232605_f57cb7be-24cc-430b-bdda-633d37752376.png"
curl.exe -L -o "00-character-locked-reference.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_013504_2436abc6-afe8-48c6-ba67-d8cda8fd7226.png"

curl.exe -L -o "01-thesis-moodiyan-ton-agge.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_014101_d0bb2fa7-77b8-425f-bd82-7f7efe03f237.png"
curl.exe -L -o "02-scents-by-amman.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_011040_42edeaa3-39fc-4b08-9365-ae16b718e0b7.png"
curl.exe -L -o "03-posters.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_011040_64a2c6bf-f22b-441c-89bc-a18097cb3ba4.png"
curl.exe -L -o "04-liminal.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_014101_04e31dc4-d5b3-4987-af8b-1711e7feb875.png"
curl.exe -L -o "05-motion-graphics.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_011040_3e82529e-57ae-46fa-aef4-a5e2db4af3e1.png"
curl.exe -L -o "06-magazine-layouts.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_011040_e01ceb73-c21c-4965-9567-99da660fa851.png"
curl.exe -L -o "07-cat-illustrations.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_011040_59567a91-510c-44a5-a3f9-46575827de04.png"
curl.exe -L -o "08-character-design-juno.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_011040_b200a256-bd95-43ee-a8b3-b226ad57bb26.png"
curl.exe -L -o "09-ewallet-app.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_011040_40346bf0-3686-4562-8e0a-a1f9ac9f2058.png"
curl.exe -L -o "10-about-waving.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_020335_9673049e-7433-4805-a58d-063c6bd55fea.png"
curl.exe -L -o "11-contact-call.png" "https://d8j0ntlcm91z4.cloudfront.net/user_35sIr7oLnLlDexG2SRZcznVeMQX/hf_20260813_020335_4f0347b3-b084-4be6-b13e-96e6b6dd15df.png"

echo.
echo Done. 13 files should now be in this folder.
pause
