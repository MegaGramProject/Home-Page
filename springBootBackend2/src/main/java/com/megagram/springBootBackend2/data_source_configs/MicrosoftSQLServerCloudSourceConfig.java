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
        entityManagerFactoryRef = "mssqlServerCloudEntityManagerFactory",
        transactionManagerRef = "mssqlServerCloudTransactionManager",
        basePackages = {"com.megagram.springBootBackend2.repositories.mssqlServer"}
)
public class MicrosoftSQLServerCloudSourceConfig {


    @Bean(name = "mssqlServerCloudSourceProperties")
    @ConfigurationProperties("spring.datasource-mssqlServerCloud")
    public DataSourceProperties mssqlServerCloudSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "mssqlServerCloudSource")
    @ConfigurationProperties("spring.datasource-mssqlServerCloud.configuration")
    public DataSource mssqlServerCloudSource(@Qualifier("mssqlServerCloudSourceProperties") DataSourceProperties mssqlServerCloudSourceProperties) {
        return mssqlServerCloudSourceProperties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }

    @Bean(name = "mssqlServerCloudEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean mssqlServerCloudEntityManagerFactory(
        EntityManagerFactoryBuilder mssqlServerCloudEntityManagerFactoryBuilder, @Qualifier("mssqlServerCloudSource") DataSource mssqlServerCloudSource) {

        Map<String, String> mssqlServerCloudJpaProperties = new HashMap<>();
        mssqlServerCloudJpaProperties.put("hibernate.dialect", "org.hibernate.dialect.SQLServerDialect");
            
                

        return mssqlServerCloudEntityManagerFactoryBuilder
            .dataSource(mssqlServerCloudSource)
            .packages("com.megagram.springBootBackend2.models.mssqlServer")
            .persistenceUnit("mssqlServerCloudSource")
            .properties(mssqlServerCloudJpaProperties)
            .build();
    }

    @Bean(name = "mssqlServerCloudTransactionManager")
    public PlatformTransactionManager mssqlServerCloudTransactionManager(
            @Qualifier("mssqlServerCloudEntityManagerFactory") EntityManagerFactory mssqlServerCloudEntityManagerFactory) {

        return new JpaTransactionManager(mssqlServerCloudEntityManagerFactory);
    }
}