FROM node:14

# Create app directory
WORKDIR /app

RUN mkdir app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY app/package*.json ./

# Bundle app source
COPY . .

WORKDIR /app/app

RUN npm install
RUN npm run build
# If you are building your code for production
# RUN npm ci --only=production

EXPOSE 3080
CMD [ "node", "/app/api/server.js" ]
