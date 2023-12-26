FROM node:20

# Install required dependencies
RUN apt-get update && \
    apt-get -y install npm git lsof libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxkbcommon0 libpango-1.0-0 libasound2 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 wget gnupg

# Install Google Chrome
WORKDIR /home
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    apt-get install -y ./google-chrome-stable_current_amd64.deb

# Prepare the test environment
WORKDIR /evals
COPY . .
RUN npm install
RUN echo "CHROME_BIN=/usr/bin/google-chrome" > .env

# Pre-install the app dependencies to speed up the tests
WORKDIR /evals/app
RUN npm install

# Allow the user "user" to write output files
RUN chmod a+rwX /evals