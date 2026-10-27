<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

it('crea un equipo y responde 201 con el encabezado Location', function () {
    $categoria = Categoria::factory()->create();

    $datos = [
        'codigo' => 'EQ-' . strtoupper(Str::random(4)),
        'codigo' => 'EQ-1234',
        'nombre' => 'Equipo de prueba',
        'categoria_id' => $categoria->id,
        'estado' => 'disponible',
        'fecha_adquisicion' => now()->subDays(10)->format('Y-m-d'),
        'costo_interno' => 50000,
    ];

    $response = $this->postJson('/api/equipos', $datos);

    $response->assertStatus(201)
        ->assertHeader('Location')
        ->assertJsonStructure([
            'data' => ['id', 'codigo', 'nombre', 'estado', 'fecha_adquisicion'],
        ]);

    $this->assertDatabaseHas('equipos', [
        'codigo' => 'EQ-1234',
        'nombre' => 'Equipo de prueba',
        'categoria_id' => $categoria->id,
    ]);
});

it('rechaza un equipo con datos inválidos y responde 422 con errores por campo', function () {
    $response = $this->postJson('/api/equipos', []);

    $response->assertStatus(422)
        ->assertJsonStructure(['message', 'errors'])
        ->assertJsonValidationErrors(['codigo', 'nombre', 'categoria_id', 'fecha_adquisicion', 'costo_interno']);
});

it('impide eliminar un equipo prestado y responde 409', function () {
    $equipo = Equipo::factory()->prestado()->create();

    $response = $this->deleteJson("/api/equipos/{$equipo->id}");

    $response->assertStatus(409)
        ->assertJson([
            'codigo' => 'REGLA_NEGOCIO',
        ])
        ->assertJsonStructure(['mensaje', 'codigo']);

    $this->assertDatabaseHas('equipos', [
        'id' => $equipo->id,
        'estado' => 'prestado',
    ]);
});
