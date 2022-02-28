#!/bin/bash
mkdir -p /opt/maperz/gustavo/
cp main.js /opt/maperz/gustavo/
cp .env /opt/maperz/gustavo/
cp package-lock.json /opt/maperz/gustavo/
cp package.json /opt/maperz/gustavo/
npm i

# Copy service file to system services
cp installation/gustavo.service /lib/systemd/system/

systemctl daemon-reload
systemctl enable gustavo
systemctl restart gustavo
