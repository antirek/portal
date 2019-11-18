# portal



based on https://github.com/ankur-anand/simple-sso


### generate keypair

generate private key

> openssl genpkey -algorithm RSA -out jwtPrivate.key -pkeyopt rsa_keygen_bits:2048

eject public key

> openssl rsa -in jwtPrivate.key -outform PEM -pubout -out jwtPublic.key
