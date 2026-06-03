using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceTableAndSeeder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Services",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    name = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Services", x => x.id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "Services",
                columns: new[] { "id", "name", "status" },
                values: new object[,]
                {
                    { 1, "General Consultation (全科门诊)", 1 },
                    { 2, "Cardiology (心脏专科)", 1 },
                    { 3, "Dental Care (牙科门诊)", 1 },
                    { 4, "Pediatrics (儿科门诊)", 1 },
                    { 5, "Neurology (神经内科)", 0 },
                    { 6, "Physiotherapy (康复理疗)", 1 }
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 1,
                column: "password",
                value: "AQAAAAIAAYagAAAAEEYsbk1IpY6m6FeMEj9qMwYvZmZMGT/Yr7OF4RDlynJLfaGowVGiV3hIrmp4IYLtBA==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 2,
                column: "password",
                value: "AQAAAAIAAYagAAAAEKHoOTxug6xsqoAKKz9Pm2y6ReLfmVUE21UkDby1BENclP3QYllxR3jD7liHMlM4qA==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 3,
                column: "password",
                value: "AQAAAAIAAYagAAAAEBaM6dsfaWMZoub3dmdmpYs0UvC60FITJoD+JM2/Ej9++E1cajeNFmC9HpgXuaEd3A==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 4,
                column: "password",
                value: "AQAAAAIAAYagAAAAEHPQzq36X32XlA/5OptYBwExqQH1xUP4WFk22wsPcmuEeOkIDMGHQ5CDloR3Qx//bQ==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 5,
                column: "password",
                value: "AQAAAAIAAYagAAAAEF7E0K+5BQndFxxujGfOVHm7/s65Y5++AAEXRjKL1inHzWkKhCT6k3JxaKypao2MoQ==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 6,
                column: "password",
                value: "AQAAAAIAAYagAAAAEFGxZRXT54rlNpL8ZM/zHkPPK7a9KQ55pJDxYFLF0yiQ/M1fHtIE0fsIz58rw3NYsg==");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Services");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 1,
                column: "password",
                value: "AQAAAAIAAYagAAAAEOe8NAqyxN4vCf1MZLcGgT+omQ6mfOSnHwCHXmX+AgwiIX3ffy07l/myXIi8Je7j7w==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 2,
                column: "password",
                value: "AQAAAAIAAYagAAAAEAOP/uZO4N+9NzjMqSYl9vetIt3q28CEB8+a7iXTRH4ZFb9VAFlfNE5hpqJ4QFCWlQ==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 3,
                column: "password",
                value: "AQAAAAIAAYagAAAAEJJpN0AG7fMzFAXbyZLnOq4zKhNG0VEH/DeNJ4L2YMI34xHUIDeUv3UI9r2SUBktxw==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 4,
                column: "password",
                value: "AQAAAAIAAYagAAAAEAzdxwumOga4x22LLEx9qm0wN9KrMTfkeQWhHT0TbZXK4vAKftWtRXng1GKvTgGB9A==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 5,
                column: "password",
                value: "AQAAAAIAAYagAAAAEJco+QMuQPfaOOQpQD9jnbUlPABHT9W1hrrewOhBgqwLlDxx1K18DS3+7DKtGZnWfw==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 6,
                column: "password",
                value: "AQAAAAIAAYagAAAAEFcHuMPpoEBoGceIOcG2IgVc2XrOI097dzkug/ChUKD9kTwv6eXxQIBOY5N4o754MA==");
        }
    }
}
