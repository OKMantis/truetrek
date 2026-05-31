class Rack::Attack
  throttle("guest_session/ip", limit: 10, period: 60) do |req|
    req.ip if req.path == "/guest_session" && req.post?
  end
end
