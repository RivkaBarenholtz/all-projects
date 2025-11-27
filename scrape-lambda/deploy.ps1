# ==========================
# EC2 DEPLOY SCRIPT (PowerShell) - Ubuntu
# ==========================

# --- CONFIG ---
$EC2User = "ubuntu"
$EC2Host = "3.85.16.177"
$EC2AppDir = "/home/ubuntu/playwright-app"
$SSHKey = "playwright.pem"   
$PM2Name = "playwright-app"
$ZipName = "deploy.zip"
# -----------------------------

Write-Host "Zipping project..."
Compress-Archive -Path * -DestinationPath $ZipName -Force -CompressionLevel Optimal

Write-Host "Uploading to EC2..."
scp -i $SSHKey $ZipName "${EC2User}@${EC2Host}:/tmp/"

Write-Host "Deploying on EC2..."
$deployScript = @"
set -e
echo "Installing unzip if needed..."
sudo apt update && sudo apt install -y unzip

echo "Moving new build to $EC2AppDir..."
mkdir -p $EC2AppDir
cd $EC2AppDir

echo "Cleaning old files..."
rm -rf *

echo "Unzipping new files..."f
unzip /tmp/$ZipName -d $EC2AppDir > /dev/null
rm /tmp/$ZipName

echo "Installing dependencies..."
npm install --omit=dev

echo "Restarting PM2..."
pm2 restart $PM2Name || pm2 start index.js --name "$PM2Name"

echo "Deployment complete!"
"@

# Execute the deploy commands remotely
ssh -i $SSHKey "$EC2User@$EC2Host" $deployScript

Write-Host "🧹 Cleaning up local zip..."
Remove-Item $ZipName -Force

Write-Host "Done!"
