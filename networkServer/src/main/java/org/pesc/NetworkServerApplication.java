package org.pesc;

import org.apache.catalina.connector.Connector;
import org.apache.catalina.startup.Tomcat;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.context.embedded.tomcat.TomcatEmbeddedServletContainer;
import org.springframework.boot.context.embedded.tomcat.TomcatEmbeddedServletContainerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan
public class NetworkServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(NetworkServerApplication.class, args);
	}

	/**
	 * Enables JNDI On Tomcat
	 * @return TomcatEmbeddedServletContainerFactory
	 */
	@Bean
	public TomcatEmbeddedServletContainerFactory tomcatFactory() {
		TomcatEmbeddedServletContainerFactory factory =  new TomcatEmbeddedServletContainerFactory() {

			@Override
			protected TomcatEmbeddedServletContainer getTomcatEmbeddedServletContainer(
					Tomcat tomcat) {
				tomcat.enableNaming();
				return super.getTomcatEmbeddedServletContainer(tomcat);
			}
		};

	  /* Not using AJP do to reverse proxy issues revolving around redirects that use an absolute path.  The
        funny thing is that the exact same configuration for HTTP works fine, so something up with AJP. */

        /*

        Connector ajpConnector = new Connector("AJP/1.3");
        ajpConnector.setPort(8009);
        ajpConnector.setSecure(false);
        ajpConnector.setAllowTrace(false);
        ajpConnector.setScheme("http");
        factory.addAdditionalTomcatConnectors(ajpConnector);
        */

		return factory;
	}

}