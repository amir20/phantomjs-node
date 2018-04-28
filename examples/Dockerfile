FROM debian:jessie
MAINTAINER Amir Raminfar <findamir@gmail.com>

RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt-get install -y nodejs build-essential g++ flex bison gperf ruby perl \
  libsqlite3-dev libfontconfig1-dev libicu-dev libfreetype6 libssl-dev \
  libpng-dev libjpeg-dev python libx11-dev libxext-dev

RUN npm install phantom

ADD async.js /async.js

ENTRYPOINT ["node", "/async.js"]
CMD ["http://stackoverflow.com"]
