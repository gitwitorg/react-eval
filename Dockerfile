# Use the Amazon Linux 2023 base image
FROM amazonlinux:2023

# Install required dependencies
RUN yum -y update && \
    yum -y install npm git lsof libXcomposite libXdamage libXrandr libgbm libxkbcommon pango alsa-lib atk at-spi2-atk cups-libs libdrm

# Set the working directory
WORKDIR /app

# Copy package-lock.json and package.json to the container
COPY package-lock.json package.json ./

# Install npm packages
RUN npm install

# Copy the src directory to the container
COPY src ./src
COPY helicone_gitwit_react_results.json ./

# Install Google Chrome
RUN yum -y install https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm

# Set the entry point to start the application
CMD ["npm", "start"]