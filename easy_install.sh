echo "Updating apt..."
apt-get update

echo "Installing dependencies..."
apt-get install -y python3-minimal build-essential python3-setuptools wget python3-pip python3-venv git build-essential python3-setuptools python3-dev libffi-dev redis-server python3-pil libjpeg-dev zlib1g-dev nginx supervisor

echo "Installing mariadb..."
apt-get install -y mariadb-server

# Set the root password
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '*WebWorks"'!'"'; FLUSH PRIVILEGES;"

echo "
[mysqld]
character-set-client-handshake = FALSE
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[mysql]
default-character-set = utf8mb4" >> /etc/mysql/my.cnf

service mysql restart

echo "Creating barako user..."
adduser barako
usermod -aG sudo barako
echo "barako ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
echo "export PATH=\$PATH:/home/barako/.local/bin" >> /home/barako/.bashrc

echo '
echo "Installing node..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm install 14
nvm use 14
npm install -g yarn

echo "Installing bench/frappe..."

pip3 install frappe-bench
bench init --frappe-path https://bitbucket.org/denim-apps/frappe frappe
echo "Succesfully installed Frappe (SERVIO fork)!"
echo ""
echo "Run \"./setup-site.sh <domain> [--erpnext]\" to set up the first site."
echo "For example \"./setup-site.sh erpnext.denimtool.com --erpnext\"."
' > /home/barako/install.sh
chmod a+x /home/barako/install.sh

echo '
[ -z "$#" ] && echo "To use this command:

./setup-site.sh <site-domain>

To include ERPNext in the installation:

./setup-site.sh <site-domain> --erpnext

For example:

./setup-site.sh erpnext.denimtool.com --erpnext" && exit

if [ "$2" = "--erpnext" ] ; then
  cd frappe/ &&
    bench get-app https://bitbucket.org/denim-apps/lemonade-erpnext/ --branch develop &&
    bench new-site --mariadb-root-password="*WebWorks"'!' --install-app="erpnext" $1
else
  cd frappe/ &&
    bench new-site --mariadb-root-password="*WebWorks"'!' $1
fi

bench setup supervisor
sudo ln ./config/supervisor.conf /etc/supervisor/conf.d/frappe.conf
sudo supervisorctl reload
bench setup nginx
sudo ln ./config/nginx.conf /etc/nginx/conf.d/frappe.conf
sudo service nginx restart
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx
' > /home/barako/setup-site.sh
chmod a+x /home/barako/setup-site.sh

echo "If you haven't yet set up a swap file for this system, you may want to by running \"./makeswap.sh\""

echo '
fallocate -l 1G /swapfile && dd if=/dev/zero of=/swapfile bs=1024 count=1048576 && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && (echo "/swapfile swap swap defaults 0 0" >> /etc/fstab) && swapon --show && free -h
' > ./makeswap.sh
chmod a+x ./makeswap.sh

echo ""
echo "To complete the next steps, run \"su - barako\" and, while logged in as the barako user, run \"./install.sh\""

echo "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
nvm install 14" > /home/barako/install-node.sh

