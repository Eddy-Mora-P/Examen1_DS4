<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GuardarEquipoRequest;
use App\Http\Resources\EquipoResource;
use App\Models\Equipo;
use App\Services\EquipoService;
use Illuminate\Http\Request;

class EquipoController extends Controller
{
    public function __construct(private EquipoService $service)
    {
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 10);
        $perPage = $perPage > 50 ? 50 : ($perPage < 1 ? 10 : $perPage);

        $equipos = $this->service->listar(
            $request->query('q'),
            $request->query('estado'),
            $perPage
        );

        return EquipoResource::collection($equipos)->response();
    }

    public function show(Equipo $equipo)
    {
        $equipo->loadMissing('categoria');

        return new EquipoResource($equipo);
    }

    public function store(GuardarEquipoRequest $request)
    {
        $equipo = $this->service->crear($request->validated());

        return (new EquipoResource($equipo))
            ->response()
            ->setStatusCode(201)
            ->header('Location', route('equipos.show', $equipo));
    }

    public function update(GuardarEquipoRequest $request, Equipo $equipo)
    {
        $equipo = $this->service->actualizar($equipo, $request->validated());

        return new EquipoResource($equipo);
    }

    public function destroy(Equipo $equipo)
    {
        $this->service->eliminar($equipo);

        return response()->noContent();
    }

    public function prestar(Equipo $equipo)
    {
        $equipo = $this->service->prestar($equipo);

        return new EquipoResource($equipo);
    }
}
