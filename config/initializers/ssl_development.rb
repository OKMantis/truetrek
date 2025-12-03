# Disable SSL certificate verification in development only
# This is a workaround for SSL CRL (Certificate Revocation List) errors
# TODO: Remove this file once the system SSL certificates are properly configured

if Rails.env.development?
  require "openssl"
  OpenSSL::SSL::VERIFY_PEER = OpenSSL::SSL::VERIFY_NONE
end
