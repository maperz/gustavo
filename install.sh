#!/bin/bash
mkdir /opt/maperz/gustavo/
cp main.js /opt/maperz/gustavo/
cp .env /opt/maperz/gustavo/

# Copy service file to system services
cp installation/gustavo.service /lib/systemd/system/

systemctl daemon-reload
systemctl enable gustavo
systemctl restart gustavo
