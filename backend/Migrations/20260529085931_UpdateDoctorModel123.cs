using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDoctorModel123 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "status",
                table: "Doctors",
                newName: "work_status");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 1,
                column: "password",
                value: "AQAAAAIAAYagAAAAEOgiNqeA1J0+BrRLHYguouX+F5SrVe/V2QzFM2z596sVKrqYxAV+RP+lMcz2tDSJHQ==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 2,
                column: "password",
                value: "AQAAAAIAAYagAAAAEG7kmyx/RwpvU6IYj/97dBXUkugJ/75uwj4EOo8QZ1ccWAGWLpObq2k7L5p0d5QdxQ==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 3,
                column: "password",
                value: "AQAAAAIAAYagAAAAECLvzEmYvU7Bl9TIpJK8pZjXCsV3unVsseHWRUwco8Z+GYMdGtk6a/tHtxbg/Bc4uA==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 4,
                column: "password",
                value: "AQAAAAIAAYagAAAAEIdMJN0W6sYrXDWmuLS21ZjBpVXxIQ1YqSU9HKeMd3aWdtqd29CI8adp4IxHxZgvUg==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 5,
                column: "password",
                value: "AQAAAAIAAYagAAAAEGiJLfGKTLrqJieD1nv6HYHrP60j0hmPaKcQel3HIN+UdywlLjBPg0y0U4nDQyJ0pw==");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "work_status",
                table: "Doctors",
                newName: "status");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 1,
                column: "password",
                value: "AQAAAAIAAYagAAAAEDGOl9LTVGZoUoGzoCz1REbJH5ILZ5G+B+lcHOFa2bqX/13YqUEVVJpVbITOfhEWuQ==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 2,
                column: "password",
                value: "AQAAAAIAAYagAAAAENFvbbPv0ErdQLa7Seo//pzKl+c8io+6sgJN0zCQ/SU0xmBoNn8qXGb0MNEycIs9Xg==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 3,
                column: "password",
                value: "AQAAAAIAAYagAAAAEJfFN+a0HyLaDtz7FSaQCln++KEA8a1ogSdq47qveopIK5C3EC3POQBljQNONNcQzw==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 4,
                column: "password",
                value: "AQAAAAIAAYagAAAAECKBntNc0fMu9kyqCrob3H0Ca2QN9kJiiIUxzClJwxbsw1BD5oSC9NPVhAp5l0ndZw==");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "id",
                keyValue: 5,
                column: "password",
                value: "AQAAAAIAAYagAAAAEOg+cnziLqmqwT4pN/uUD9eKTRqsgms7EIaZ41304Xe2DhtB0SZACCCa/XZVKYYsbQ==");
        }
    }
}
