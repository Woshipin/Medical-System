using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateStructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Gender",
                table: "Doctors",
                newName: "GenderId");

            migrationBuilder.AlterColumn<string>(
                name: "LicenseNumber",
                table: "Doctors",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldMaxLength: 50)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Genders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Genders", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_GenderId",
                table: "Doctors",
                column: "GenderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Doctors_Genders_GenderId",
                table: "Doctors",
                column: "GenderId",
                principalTable: "Genders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Doctors_Genders_GenderId",
                table: "Doctors");

            migrationBuilder.DropTable(
                name: "Genders");

            migrationBuilder.DropIndex(
                name: "IX_Doctors_GenderId",
                table: "Doctors");

            migrationBuilder.RenameColumn(
                name: "GenderId",
                table: "Doctors",
                newName: "Gender");

            migrationBuilder.AlterColumn<string>(
                name: "LicenseNumber",
                table: "Doctors",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
