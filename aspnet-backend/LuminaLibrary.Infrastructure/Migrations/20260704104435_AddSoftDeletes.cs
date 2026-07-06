using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LuminaLibrary.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSoftDeletes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "books",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "books",
                keyColumn: "id",
                keyValue: new Guid("b0000000-0000-0000-0000-000000000001"),
                column: "is_deleted",
                value: false);

            migrationBuilder.UpdateData(
                table: "books",
                keyColumn: "id",
                keyValue: new Guid("b0000000-0000-0000-0000-000000000002"),
                column: "is_deleted",
                value: false);

            migrationBuilder.UpdateData(
                table: "books",
                keyColumn: "id",
                keyValue: new Guid("b0000000-0000-0000-0000-000000000003"),
                column: "is_deleted",
                value: false);

            migrationBuilder.UpdateData(
                table: "books",
                keyColumn: "id",
                keyValue: new Guid("b0000000-0000-0000-0000-000000000004"),
                column: "is_deleted",
                value: false);

            migrationBuilder.UpdateData(
                table: "books",
                keyColumn: "id",
                keyValue: new Guid("b0000000-0000-0000-0000-000000000005"),
                column: "is_deleted",
                value: false);

            migrationBuilder.UpdateData(
                table: "books",
                keyColumn: "id",
                keyValue: new Guid("b0000000-0000-0000-0000-000000000006"),
                column: "is_deleted",
                value: false);

            migrationBuilder.UpdateData(
                table: "books",
                keyColumn: "id",
                keyValue: new Guid("b0000000-0000-0000-0000-000000000007"),
                column: "is_deleted",
                value: false);

            migrationBuilder.UpdateData(
                table: "books",
                keyColumn: "id",
                keyValue: new Guid("b0000000-0000-0000-0000-000000000008"),
                column: "is_deleted",
                value: false);

            migrationBuilder.UpdateData(
                table: "books",
                keyColumn: "id",
                keyValue: new Guid("b0000000-0000-0000-0000-000000000009"),
                column: "is_deleted",
                value: false);

            migrationBuilder.UpdateData(
                table: "books",
                keyColumn: "id",
                keyValue: new Guid("b0000000-0000-0000-0000-000000000010"),
                column: "is_deleted",
                value: false);

            migrationBuilder.UpdateData(
                table: "books",
                keyColumn: "id",
                keyValue: new Guid("b0000000-0000-0000-0000-000000000011"),
                column: "is_deleted",
                value: false);

            migrationBuilder.UpdateData(
                table: "books",
                keyColumn: "id",
                keyValue: new Guid("b0000000-0000-0000-0000-000000000012"),
                column: "is_deleted",
                value: false);

            migrationBuilder.UpdateData(
                table: "books",
                keyColumn: "id",
                keyValue: new Guid("b0000000-0000-0000-0000-000000000013"),
                column: "is_deleted",
                value: false);

            migrationBuilder.UpdateData(
                table: "books",
                keyColumn: "id",
                keyValue: new Guid("b0000000-0000-0000-0000-000000000014"),
                column: "is_deleted",
                value: false);

            migrationBuilder.UpdateData(
                table: "books",
                keyColumn: "id",
                keyValue: new Guid("b0000000-0000-0000-0000-000000000015"),
                column: "is_deleted",
                value: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "users");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "books");
        }
    }
}
