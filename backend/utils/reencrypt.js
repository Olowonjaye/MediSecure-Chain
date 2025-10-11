export function reencrypt(ownerEncryptedKey, medicPubKey){
  return ownerEncryptedKey + '::REENC::' + medicPubKey.slice(0,8);
}
