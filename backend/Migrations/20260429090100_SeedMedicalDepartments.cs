using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class SeedMedicalDepartments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Departments",
                columns: new[] { "Id", "IsActive", "Location", "Name" },
                values: new object[,]
                {
                    { 1, true, "Block A, Level 1", "Emergency Department (ER)" },
                    { 2, true, "Block B, Level 3", "Cardiology" },
                    { 3, true, "Block B, Level 4", "Neurology" },
                    { 4, true, "Block C, Level 2", "Pediatrics" },
                    { 5, true, "Block D, Level 1", "Oncology" },
                    { 6, true, "Block A, Level 2", "Orthopedics" },
                    { 7, true, "Block A, Level 3", "General Surgery" },
                    { 8, true, "Block A, Level 4", "Intensive Care Unit (ICU)" },
                    { 9, true, "Block C, Basement 1", "Radiology & Imaging" },
                    { 10, true, "Block A, Level 1", "Pharmacy" },
                    { 11, true, "Block C, Level 3", "Obstetrics and Gynecology" },
                    { 12, false, "Block B, Level 1", "Dental Clinic" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 12);
        }
    }
}
