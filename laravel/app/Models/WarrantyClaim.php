<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WarrantyClaim extends Model
{
    protected $table = 'warranty_claims';

    public const CREATED_AT = 'submitted_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'claim_number',
        'user_id',
        'order_item_id',
        'product_serial_number',
        'claim_reason',
        'problem_description',
        'claim_status',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(WarrantyClaimImage::class);
    }
}
