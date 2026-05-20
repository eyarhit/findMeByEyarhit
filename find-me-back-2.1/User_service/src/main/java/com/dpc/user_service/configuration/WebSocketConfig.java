package com.dpc.user_service.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

//    @Override
//    public void registerStompEndpoints(StompEndpointRegistry registry) {
//        // SockJS endpoint for clients to connect to
//        registry.addEndpoint("/ws-notifications")
//                .setAllowedOriginPatterns("*")
//                .withSockJS();
//    }
//
//    @Override
//    public void configureMessageBroker(MessageBrokerRegistry registry) {
//        // Enable simple broker with /topic and /queue prefixes
//        registry.enableSimpleBroker("/topic", "/queue");
//        // Prefix for messages bound for @MessageMapping methods
//        registry.setApplicationDestinationPrefixes("/app");
//        // Prefix for user-specific destinations
//        registry.setUserDestinationPrefix("/user");
//    }

//=> this configuration for both (messages and notification), using ws (all websoket configuration) instead just ws-notification (specific for notification)
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] allow = {"http://localhost:4200", "http://127.0.0.1:4200", "http://localhost:80", "*"};
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allow)
                .withSockJS();
        registry.addEndpoint("/ws-notifications")
                .setAllowedOriginPatterns(allow)
                .withSockJS();
    }


}
