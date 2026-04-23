using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class HeaderUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Genders_GenderId",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "Users",
                newName: "Updated_at");

            migrationBuilder.RenameColumn(
                name: "PhoneNumber",
                table: "Users",
                newName: "Phone_Number");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "Users",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "GenderId",
                table: "Users",
                newName: "Gender");

            migrationBuilder.RenameColumn(
                name: "FullName",
                table: "Users",
                newName: "Full_Name");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Users",
                newName: "Created_at");

            migrationBuilder.RenameIndex(
                name: "IX_Users_GenderId",
                table: "Users",
                newName: "IX_Users_Gender");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Genders_Gender",
                table: "Users",
                column: "Gender",
                principalTable: "Genders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Genders_Gender",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "Updated_at",
                table: "Users",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Users",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "Phone_Number",
                table: "Users",
                newName: "PhoneNumber");

            migrationBuilder.RenameColumn(
                name: "Gender",
                table: "Users",
                newName: "GenderId");

            migrationBuilder.RenameColumn(
                name: "Full_Name",
                table: "Users",
                newName: "FullName");

            migrationBuilder.RenameColumn(
                name: "Created_at",
                table: "Users",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_Users_Gender",
                table: "Users",
                newName: "IX_Users_GenderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Genders_GenderId",
                table: "Users",
                column: "GenderId",
                principalTable: "Genders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
