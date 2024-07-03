using System.Data;
using Microsoft.Extensions.Configuration;
using MySql.Data.MySqlClient;

namespace Megagram.Data
{
    public class MySqlDatabaseService
    {
        private readonly string _connectionString;

        public MySqlDatabaseService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("MySQLConnection");
        }

        public DataTable ExecuteQueryWithResults(MySqlCommand cmd)
        {
            DataTable dt = new DataTable();

            using (MySqlConnection conn = new MySqlConnection(_connectionString))
            {
                conn.Open();
                cmd.Connection = conn;
                using (MySqlDataAdapter da = new MySqlDataAdapter(cmd))
                {
                    da.Fill(dt);
                }
            }

            return dt;
        }
    }
}
