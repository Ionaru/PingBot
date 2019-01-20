FROM node:10-alpine


## INSTALL

RUN mkdir /app/
RUN mkdir /app/config
WORKDIR /app

# Copy needed build files
COPY ./package.json .
COPY ./package-lock.json .
COPY ./tsconfig.json .

# Copy source files
COPY ./src ./src

# Install server dependencies
RUN npm install

# Build server for production
RUN npm run build

# Add volumes
VOLUME /app/config


## RUN

EXPOSE  80
EXPOSE  443
ENV LEVEL debug
ENV NODE_ENV production
CMD ["node", "./dist/ping-bot.js"]
