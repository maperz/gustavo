#!/bin/bash
mkdir -p /opt/maperz/gustavo/
cp main.js /opt/maperz/gustavo/
cp .env /opt/maperz/gustavo/
npm i
cp node_modules /opt/maperz/gustavo/

# Copy service file to system services
cp installation/gustavo.service /lib/systemd/system/

systemctl daemon-reload
systemctl enable gustavo
systemctl restart gustavo
