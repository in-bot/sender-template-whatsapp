FROM node:18
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)

WORKDIR /code
ENV TZ=America/Sao_Paulo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY package*.json /code/

RUN npm install

# If you are building your code for production
# RUN npm ci --only=production
RUN npm ci
COPY . /code

#RUN npm test

# Bundle app source

EXPOSE 19000
CMD [ "node", "/code/src/server.js" ]
