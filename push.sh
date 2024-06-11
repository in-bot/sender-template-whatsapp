#!/bin/bash

#
# Builds and publishes docker image
#
#

MYDIR=$(dirname $0)
perl -pi -e 'chomp' $MYDIR/VERSION
VERSION=$(cat $MYDIR/VERSION)
echo VERSION IS: $VERSION
ACCOUNT=931985504193
REPONAME=sender-template-whatsapp
REPO=${ACCOUNT}.dkr.ecr.us-east-1.amazonaws.com/$REPONAME
REGION=us-east-1

export COMPILE_ONLY=""

echo ==================
echo logging in 
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${ACCOUNT}.dkr.ecr.us-east-1.amazonaws.com

# $(aws ecr get-login --no-include-email --region us-east-1)
echo =========== 
echo checando se já existe essa versão no repositório
if aws ecr describe-images --repository-name $REPONAME --region $REGION --output json | jq '.imageDetails[] | select(.imageTags? | any(.[]; contains("'$VERSION'")))' | grep $VERSION; then
    echo "VERSION $VERSION já existe no repositório... vamos apenas compilar"
    COMPILE_ONLY=1
else
  echo "VERSION $VERSION ainda nao existe: vamos publicar"
fi

echo ==================
echo Building Docker image
rm -rf node_modules
if [ -f .env ]; then
  mv .env .env-tmp
fi
docker build . -t $REPO:$VERSION -t $REPO:latest || exit 1
if [ -f .env-tmp ]; then
  mv .env-tmp .env
fi

if [ -z "$COMPILE_ONLY" ]; then
  echo ==================
  echo Publishin docker image to repo
  docker push $REPO:$VERSION || exit 2

  echo ==================
  echo commitando e tagueando no git como versao $VERSION
  git commit -a -m "Version bump to ${VERSION}"
  git tag $VERSION
  git push --tags
  git push || echo
fi

echo done

