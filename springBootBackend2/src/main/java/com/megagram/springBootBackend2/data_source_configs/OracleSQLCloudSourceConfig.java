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
        entityManagerFactoryRef = "oracleSQLCloudEntityManagerFactory",
        transactionManagerRef = "oracleSQLCloudTransactionManager",
        basePackages = {"com.megagram.springBootBackend2.repositories.oracleSQL"}
)
public class OracleSQLCloudSourceConfig {


    @Bean(name = "oracleSQLCloudSourceProperties")
    @ConfigurationProperties("spring.datasource-oracleSQLCloud")
    public DataSourceProperties oracleSQLCloudSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "oracleSQLCloudSource")
    @ConfigurationProperties("spring.datasource-oracleSQLCloud.configuration")
    public DataSource oracleSQLCloudSource(@Qualifier("oracleSQLCloudSourceProperties") DataSourceProperties oracleSQLCloudSourceProperties) {
        return oracleSQLCloudSourceProperties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }

    @Bean(name = "oracleSQLCloudEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean oracleSQLCloudEntityManagerFactory(
        EntityManagerFactoryBuilder oracleSQLCloudEntityManagerFactoryBuilder, @Qualifier("oracleSQLCloudSource") DataSource oracleSQLCloudSource) {

        Map<String, String> oracleSQLCloudJpaProperties = new HashMap<>();
        oracleSQLCloudJpaProperties.put("hibernate.dialect", "org.hibernate.dialect.OracleDialect");
                

        return oracleSQLCloudEntityManagerFactoryBuilder
            .dataSource(oracleSQLCloudSource)
            .packages("com.megagram.springBootBackend2.models.oracleSQL")
            .persistenceUnit("oracleSQLCloudSource")
            .properties(oracleSQLCloudJpaProperties)
            .build();
    }

    @Bean(name = "oracleSQLCloudTransactionManager")
    public PlatformTransactionManager oracleSQLCloudTransactionManager(
            @Qualifier("oracleSQLCloudEntityManagerFactory") EntityManagerFactory oracleSQLCloudEntityManagerFactory) {

        return new JpaTransactionManager(oracleSQLCloudEntityManagerFactory);
    }
}