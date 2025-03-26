package com.megagram.springBootBackend2.data_source_configs;

import java.util.HashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import com.zaxxer.hikari.HikariDataSource;

import jakarta.persistence.EntityManagerFactory;


@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
        entityManagerFactoryRef = "googleCloudSpannerMySQLEntityManagerFactory",
        transactionManagerRef = "googleCloudSpannerMySQLTransactionManager",
        basePackages = {"com.megagram.springBootBackend2.repositories.googleCloudSpannerMySQL"}
)
public class GoogleCloudSpannerMySQLSourceConfig {


    @Bean(name = "googleCloudSpannerMySQLSourceProperties")
    @ConfigurationProperties("spring.datasource-googleCloudSpannerMySQL")
    public DataSourceProperties googleCloudSpannerMySQLSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "googleCloudSpannerMySQLSource")
    @ConfigurationProperties("spring.datasource-googleCloudSpannerMySQL.configuration")
    public DataSource googleCloudSpannerMySQLSource(@Qualifier("googleCloudSpannerMySQLSourceProperties") DataSourceProperties googleCloudSpannerMySQLSourceProperties) {
        return googleCloudSpannerMySQLSourceProperties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }

    @Bean(name = "googleCloudSpannerMySQLEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean googleCloudSpannerMySQLEntityManagerFactory(
        EntityManagerFactoryBuilder googleCloudSpannerMySQLEntityManagerFactoryBuilder, @Qualifier("googleCloudSpannerMySQLSource") DataSource googleCloudSpannerMySQLSource) {

        Map<String, String> googleCloudSpannerMySQLJpaProperties = new HashMap<>();
        googleCloudSpannerMySQLJpaProperties.put("hibernate.dialect", "org.hibernate.dialect.SQLServerDialect");
            
                

        return googleCloudSpannerMySQLEntityManagerFactoryBuilder
            .dataSource(googleCloudSpannerMySQLSource)
            .packages("com.megagram.springBootBackend2.models.googleCloudSpannerMySQL")
            .persistenceUnit("googleCloudSpannerMySQLSource")
            .properties(googleCloudSpannerMySQLJpaProperties)
            .build();
    }

    @Bean(name = "googleCloudSpannerMySQLTransactionManager")
    public PlatformTransactionManager googleCloudSpannerMySQLTransactionManager(
            @Qualifier("googleCloudSpannerMySQLEntityManagerFactory") EntityManagerFactory googleCloudSpannerMySQLEntityManagerFactory) {

        return new JpaTransactionManager(googleCloudSpannerMySQLEntityManagerFactory);
    }
}