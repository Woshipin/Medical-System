using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddDoctorSchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DoctorLeaves",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    doctor_id = table.Column<int>(type: "int", nullable: false),
                    leave_type = table.Column<int>(type: "int", nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    start_time = table.Column<TimeOnly>(type: "time(6)", nullable: true),
                    end_time = table.Column<TimeOnly>(type: "time(6)", nullable: true),
                    is_full_day = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    status = table.Column<int>(type: "int", nullable: false),
                    reason = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    approved_by = table.Column<int>(type: "int", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoctorLeaves", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoctorLeaves_Doctors_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DoctorLeaves_Users_approved_by",
                        column: x => x.approved_by,
                        principalTable: "Users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "DoctorSchedules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    doctor_id = table.Column<int>(type: "int", nullable: false),
                    day_of_week = table.Column<int>(type: "int", nullable: false),
                    start_time = table.Column<TimeOnly>(type: "time(6)", nullable: false),
                    end_time = table.Column<TimeOnly>(type: "time(6)", nullable: false),
                    slot_duration = table.Column<int>(type: "int", nullable: false),
                    is_active = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoctorSchedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoctorSchedules_Doctors_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 1,
                column: "password",
                value: "AQAAAAIAAYagAAAAELAFZvJPQGpvaoek0/f55METLf7/+Y6nOpSdGGiU7j7HEmZepOtT5rZWKejxbZm+Jw==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 2,
                column: "password",
                value: "AQAAAAIAAYagAAAAEHbZLygNRovzH0dSZDQ+HO9sw+AeOIuXgacT7aH7lPdW3wsWlKc1ge3EJITmKxDN9Q==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 3,
                column: "password",
                value: "AQAAAAIAAYagAAAAEEFFRBXeSDvVAQWGrJAl3EvvpYadNMDp8EDTdWTB+lVVjW+Uet71n58CnOvhfy7bcA==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 4,
                column: "password",
                value: "AQAAAAIAAYagAAAAECAI8IrKoc07Q5eck+N6pR0hSM/Ltn2v846D+1x2y+eFCALVqC3nKSk1BnbQ9D+ELg==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 5,
                column: "password",
                value: "AQAAAAIAAYagAAAAEGUoxMgnNyBOrAd445rivV5wu07MX6e1HzfbSvRd59laihG+Wte5Svc4DZUs8w99Sg==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 6,
                column: "password",
                value: "AQAAAAIAAYagAAAAEGOPQj874JfukyUrbEV+mqqxhsBns/6Bpbt7m9UW9TqAxCEMA3IKXS8UOSAmImp7sw==");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorLeaves_approved_by",
                table: "DoctorLeaves",
                column: "approved_by");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorLeaves_doctor_id",
                table: "DoctorLeaves",
                column: "doctor_id");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSchedules_doctor_id_day_of_week",
                table: "DoctorSchedules",
                columns: new[] { "doctor_id", "day_of_week" },
                unique: true,
                filter: "is_active = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DoctorLeaves");

            migrationBuilder.DropTable(
                name: "DoctorSchedules");

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
    }
}
