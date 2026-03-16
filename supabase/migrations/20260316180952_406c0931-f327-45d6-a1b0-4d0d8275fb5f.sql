-- Remove orphan test domain that was incorrectly added to Master Tenant
DELETE FROM tenant_domains WHERE id = '809bcf6b-8427-47c4-ac45-e948cf44c9b7' AND domain = 'teste.com.br';
